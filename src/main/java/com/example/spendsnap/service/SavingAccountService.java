package com.example.spendsnap.service;

import com.example.spendsnap.dao.SavingAccountDao;
import com.example.spendsnap.dao.UserDao;
import com.example.spendsnap.dto.SavingAccountDto;
import com.example.spendsnap.exceptions.ConflictException;
import com.example.spendsnap.model.*;
import lombok.RequiredArgsConstructor;
import org.jetbrains.annotations.Nullable;
import org.springframework.data.crossstore.ChangeSetPersister;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SavingAccountService {

    private final UserDao userDao;
    private final SavingAccountDao savingAccountDao;

    @Transactional
    public SavingAccountDto createSavingAccount(SavingAccountDto dto)
            throws ChangeSetPersister.NotFoundException {

        // 1) Resolve owner
        Integer userId = dto.getUserId();
        UserModel user = userDao.findById(userId)
                .orElseThrow(ChangeSetPersister.NotFoundException::new);

        // 2) Uniqueness by (user, name)
        String name = dto.getName() != null ? dto.getName().trim() : null;
        if (name != null && savingAccountDao.existsByUser_IdAndNameIgnoreCase(userId, name)) {
            throw new ConflictException("Saving account name already exists for this user.");
        }

        // 3) Map DTO -> Entity
        Saving_Account e = new Saving_Account();
        e.setUser(user);
        e.setName(name);
        e.setCurrency(dto.getCurrency() != null ? dto.getCurrency().trim().toUpperCase() : null);
        e.setStatus(dto.getStatus() != null ? dto.getStatus() : Status.ACTIVE);
        e.setOpening_balance(dto.getOpening_balance() != null ? dto.getOpening_balance() : 0d);
        e.setInterestApr(dto.getInterestApr() != null ? dto.getInterestApr() : BigDecimal.ZERO);
        e.setCompounding(dto.getCompounding() != null ? dto.getCompounding() : Compounding.MONTHLY);
        e.setDay_count_conversion(
                dto.getDay_count_conversion() != null ? dto.getDay_count_conversion() : DayCountConversion.ACT_365F
        );
        e.setLast_interest_posted_at(dto.getLast_interest_posted_at());
        e.setNotes(dto.getNotes());

        // 4) Server-managed timestamps
        e.setCreated_at(OffsetDateTime.now());
        e.setUpdated_at(OffsetDateTime.now());

        // 5) Persist & return DTO
        Saving_Account saved = savingAccountDao.save(e);
        return toDto(saved);
    }


    @Transactional
    public SavingAccountDto transfer(Integer userId,
                                     Integer fromId,
                                     Integer toId,
                                     BigDecimal amount,
                                     String memo) // memo unused for now (no ledger)
            throws ChangeSetPersister.NotFoundException {

        if (fromId == null || toId == null || userId == null) {
            throw new IllegalArgumentException("userId, fromId, toId are required.");
        }
        if (fromId.equals(toId)) {
            throw new ConflictException("Cannot transfer to the same account.");
        }
        if (amount == null || amount.signum() <= 0) {
            throw new ConflictException("Amount must be positive.");
        }

        // Always load in a consistent order to reduce deadlock risk
        Integer firstId  = fromId < toId ? fromId : toId;
        Integer secondId = fromId < toId ? toId   : fromId;

        Saving_Account first = savingAccountDao.findByIdAndUserId(firstId, userId)
                .orElseThrow(ChangeSetPersister.NotFoundException::new);
        Saving_Account second = savingAccountDao.findByIdAndUserId(secondId, userId)
                .orElseThrow(ChangeSetPersister.NotFoundException::new);

        // Map to from/to after loading in ordered fashion
        Saving_Account from = (first.getId().equals(fromId)) ? first : second;
        Saving_Account to   = (first.getId().equals(toId))   ? first : second;

        // Status checks
        if (from.getStatus() != Status.ACTIVE) {
            throw new ConflictException("Source account is inactive.");
        }
        if (to.getStatus() != Status.ACTIVE) {
            throw new ConflictException("Destination account is inactive.");
        }

        // Currency match
        String fromCur = from.getCurrency() != null ? from.getCurrency().trim().toUpperCase() : null;
        String toCur   = to.getCurrency()   != null ? to.getCurrency().trim().toUpperCase()   : null;
        if (!Objects.equals(fromCur, toCur)) {
            throw new ConflictException("Currencies must match for transfer.");
        }

        // Use opening_balance as the working balance for now
        BigDecimal fromBal = BigDecimal.valueOf(from.getOpening_balance() != null ? from.getOpening_balance() : 0d);
        BigDecimal toBal   = BigDecimal.valueOf(to.getOpening_balance()   != null ? to.getOpening_balance()   : 0d);

        BigDecimal amt = amount.setScale(2, RoundingMode.HALF_UP);
        if (fromBal.compareTo(amt) < 0) {
            throw new ConflictException("Insufficient funds.");
        }

        // Apply atomic updates
        fromBal = fromBal.subtract(amt);
        toBal   = toBal.add(amt);

        from.setOpening_balance(fromBal.doubleValue());
        to.setOpening_balance(toBal.doubleValue());

        OffsetDateTime now = OffsetDateTime.now();
        from.setUpdated_at(now);
        to.setUpdated_at(now);

        // Persist both
        savingAccountDao.save(from);
        savingAccountDao.save(to);

        // Return the destination account (or build a custom TransferResult if you prefer)
        return toDto(to);
    }


    @Transactional
    public SavingAccountDto archiveSavingAccount(Integer userId, Integer accountId)
            throws ChangeSetPersister.NotFoundException {

        // Enforce ownership in the lookup
        Saving_Account e = savingAccountDao.findByIdAndUserId(accountId, userId)
                .orElseThrow(ChangeSetPersister.NotFoundException::new);

        // Idempotent: if already inactive, just return current state
        if (e.getStatus() == Status.INACTIVE) {
            return toDto(e);
        }

        e.setStatus(Status.INACTIVE);
        e.setUpdated_at(OffsetDateTime.now());

        Saving_Account saved = savingAccountDao.save(e);
        return toDto(saved);
    }





    @Transactional
    public SavingAccountDto updateSavingAccount(Integer userId,
                                                Integer accountId,
                                                SavingAccountDto patch)
            throws ChangeSetPersister.NotFoundException {

        // 1) Load with ownership
        Saving_Account e = savingAccountDao.findByIdAndUserId(accountId, userId)
                .orElseThrow(ChangeSetPersister.NotFoundException::new);

        // 2) Name (optional, unique per user, case-insensitive)
        if (patch.getName() != null) {
            String newName = patch.getName().trim();
            if (newName.isEmpty()) {
                throw new ConflictException("Name cannot be blank.");
            }
            if (!newName.equalsIgnoreCase(e.getName())) {
                boolean taken = savingAccountDao
                        .existsByUserIdAndNameIgnoreCaseAndIdNot(userId, newName, accountId);
                if (taken) {
                    throw new ConflictException("Saving account name already exists for this user.");
                }
                e.setName(newName);
            }
        }

        // 3) Currency (allow change only if balance == 0)
        if (patch.getCurrency() != null) {
            String newCur = patch.getCurrency().trim().toUpperCase();
            String oldCur = e.getCurrency() == null ? null : e.getCurrency().trim().toUpperCase();
            if (!Objects.equals(newCur, oldCur)) {
                double bal = e.getOpening_balance() != null ? e.getOpening_balance() : 0d; // using opening_balance as current
                if (Math.abs(bal) > 0.000001d) {
                    throw new ConflictException("Cannot change currency while balance is not zero.");
                }
                e.setCurrency(newCur);
            }
        }

        // 4) Status (optional; ACTIVE/INACTIVE)
        if (patch.getStatus() != null && patch.getStatus() != e.getStatus()) {
            e.setStatus(patch.getStatus());
        }

        // 5) Interest APR (>= 0)
        if (patch.getInterestApr() != null) {
            if (patch.getInterestApr().signum() < 0) {
                throw new ConflictException("interestApr cannot be negative.");
            }
            // Optional: normalize scale
            e.setInterestApr(patch.getInterestApr().setScale(6, RoundingMode.HALF_UP));
        }

        // 6) Compounding / Day count conversion (enums)
        if (patch.getCompounding() != null) {
            e.setCompounding(patch.getCompounding());
        }
        if (patch.getDay_count_conversion() != null) {
            e.setDay_count_conversion(patch.getDay_count_conversion());
        }

        // 7) Last interest posted at (optional manual adjustment)
        if (patch.getLast_interest_posted_at() != null) {
            e.setLast_interest_posted_at(patch.getLast_interest_posted_at());
        }

        // 8) Notes
        if (patch.getNotes() != null) {
            e.setNotes(patch.getNotes().trim());
        }

        // 9) Opening balance is treated as current balance in your model — do not allow patching it here
        if (patch.getOpening_balance() != null
                && !Objects.equals(patch.getOpening_balance(), e.getOpening_balance())) {
            throw new ConflictException("Use deposit/withdraw/transfer to change balance.");
        }

        // 10) Server-managed timestamps
        e.setUpdated_at(OffsetDateTime.now());

        // 11) Persist & return
        Saving_Account saved = savingAccountDao.save(e);
        return toDto(saved);
    }

    @Transactional
    public SavingAccountDto deposit(Integer userId, Integer accountId, BigDecimal amount, @Nullable String memo)
            throws ChangeSetPersister.NotFoundException {

        if (amount == null || amount.signum() <= 0) {
            throw new ConflictException("Amount must be positive.");
        }

        Saving_Account e = savingAccountDao.findByIdAndUserId(accountId, userId)
                .orElseThrow(ChangeSetPersister.NotFoundException::new);

        if (e.getStatus() != Status.ACTIVE) {
            throw new ConflictException("Account is inactive.");
        }

        BigDecimal bal = BigDecimal.valueOf(e.getOpening_balance() != null ? e.getOpening_balance() : 0d);
        BigDecimal amt = amount.setScale(2, RoundingMode.HALF_UP);

        bal = bal.add(amt);

        e.setOpening_balance(bal.doubleValue());
        e.setUpdated_at(OffsetDateTime.now());

        return toDto(savingAccountDao.save(e));
    }




    @Transactional
    public SavingAccountDto withdraw(Integer userId, Integer accountId, BigDecimal amount, @Nullable String memo)
            throws ChangeSetPersister.NotFoundException {

        if (amount == null || amount.signum() <= 0) {
            throw new ConflictException("Amount must be positive.");
        }

        Saving_Account e = savingAccountDao.findByIdAndUserId(accountId, userId)
                .orElseThrow(ChangeSetPersister.NotFoundException::new);

        if (e.getStatus() != Status.ACTIVE) {
            throw new ConflictException("Account is inactive.");
        }

        BigDecimal bal = BigDecimal.valueOf(e.getOpening_balance() != null ? e.getOpening_balance() : 0d);
        BigDecimal amt = amount.setScale(2, RoundingMode.HALF_UP);

        if (bal.compareTo(amt) < 0) {
            throw new ConflictException("Insufficient funds.");
        }

        bal = bal.subtract(amt);

        e.setOpening_balance(bal.doubleValue());
        e.setUpdated_at(OffsetDateTime.now());

        return toDto(savingAccountDao.save(e));
    }
    @Transactional(readOnly = true)
    public BigDecimal getBalance(Integer userId, Integer accountId)
            throws ChangeSetPersister.NotFoundException {

        Saving_Account e = savingAccountDao.findByIdAndUserId(accountId, userId)
                .orElseThrow(ChangeSetPersister.NotFoundException::new);

        BigDecimal bal = BigDecimal.valueOf(e.getOpening_balance() != null ? e.getOpening_balance() : 0d);
        return bal.setScale(2, RoundingMode.HALF_UP);
    }



    @Transactional
    public BigDecimal accrueInterestIfDue(Integer userId, Integer accountId, @Nullable OffsetDateTime asOf)
            throws ChangeSetPersister.NotFoundException {

        Saving_Account e = savingAccountDao.findByIdAndUserId(accountId, userId)
                .orElseThrow(ChangeSetPersister.NotFoundException::new);

        BigDecimal apr = e.getInterestApr() != null ? e.getInterestApr() : BigDecimal.ZERO;
        if (apr.signum() <= 0) return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        OffsetDateTime now = asOf != null ? asOf : OffsetDateTime.now();

        OffsetDateTime periodStart = e.getLast_interest_posted_at();
        if (periodStart == null) periodStart = e.getCreated_at();
        if (periodStart == null) periodStart = now; // extreme fallback

        BigDecimal totalInterest = BigDecimal.ZERO;
        OffsetDateTime cursor = periodStart;

        while (true) {
            OffsetDateTime periodEnd = nextPeriodEnd(cursor, e.getCompounding());
            if (periodEnd.isAfter(now)) break; // no full period yet

            long days = ChronoUnit.DAYS.between(cursor, periodEnd);
            int denom = dayCountDenominator(e.getDay_count_conversion()); // ACT/365F -> 365

            BigDecimal bal = BigDecimal.valueOf(e.getOpening_balance() != null ? e.getOpening_balance() : 0d);
            BigDecimal interest = bal
                    .multiply(apr).divide(BigDecimal.valueOf(100), 12, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(days))
                    .divide(BigDecimal.valueOf(denom), 12, RoundingMode.HALF_UP);

            if (interest.signum() > 0) {
                // apply as deposit (compounding over periods)
                bal = bal.add(interest);
                e.setOpening_balance(bal.doubleValue());
                totalInterest = totalInterest.add(interest);
            }
            cursor = periodEnd; // move to next period
        }

        if (totalInterest.signum() > 0) {
            e.setLast_interest_posted_at(cursor);
            e.setUpdated_at(OffsetDateTime.now());
            savingAccountDao.save(e);
        }

        return totalInterest.setScale(2, RoundingMode.HALF_UP);
    }

    private OffsetDateTime nextPeriodEnd(OffsetDateTime start, Compounding c) {
        if (c == null || c == Compounding.MONTHLY) {
            return start.plusMonths(1);
        } else if (c == Compounding.DAILY) {
            return start.plusDays(1);
        } else {
            // default: monthly
            return start.plusMonths(1);
        }
    }


    @Transactional(readOnly = true)
    public BigDecimal previewInterest(Integer userId, Integer accountId, OffsetDateTime from, OffsetDateTime to)
            throws ChangeSetPersister.NotFoundException {

        Saving_Account e = savingAccountDao.findByIdAndUserId(accountId, userId)
                .orElseThrow(ChangeSetPersister.NotFoundException::new);

        BigDecimal apr = e.getInterestApr() != null ? e.getInterestApr() : BigDecimal.ZERO;
        if (apr.signum() <= 0 || to.isBefore(from)) return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        BigDecimal bal = BigDecimal.valueOf(e.getOpening_balance() != null ? e.getOpening_balance() : 0d);
        long days = ChronoUnit.DAYS.between(from, to);
        int denom = dayCountDenominator(e.getDay_count_conversion());

        BigDecimal interest = bal
                .multiply(apr).divide(BigDecimal.valueOf(100), 12, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(days))
                .divide(BigDecimal.valueOf(denom), 12, RoundingMode.HALF_UP);

        return interest.max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
    }


    @Transactional(readOnly = true)
    public SavingAccountDto getSnapshot(Integer userId, Integer accountId)
            throws ChangeSetPersister.NotFoundException {

        Saving_Account e = savingAccountDao.findByIdAndUserId(accountId, userId)
                .orElseThrow(ChangeSetPersister.NotFoundException::new);
        return toDto(e);
    }

    private int dayCountDenominator(DayCountConversion dcc) {
        // Extend as you add more conventions
        return (dcc == DayCountConversion.ACT_365F) ? 365 : 365;
    }

    @Transactional
    public void deleteSavingAccount(Integer userId, Integer accountId)
            throws ChangeSetPersister.NotFoundException {

        Saving_Account e = savingAccountDao.findByIdAndUserId(accountId, userId)
                .orElseThrow(ChangeSetPersister.NotFoundException::new);

        double bal = e.getOpening_balance() != null ? e.getOpening_balance() : 0d;
        if (Math.abs(bal) > 0.000001d) {
            throw new ConflictException("Withdraw funds before deleting the account.");
        }

        savingAccountDao.delete(e);
    }

    @Transactional(readOnly = true)
    public List<SavingAccountDto> listSavingAccounts(Integer userId,Status status)  {
            List<Saving_Account> entites = (status == null)
                    ? savingAccountDao.findAllByUserIdOrderByUpdatedDesc(userId)
                    :  savingAccountDao.findAllByUserIdAndStatusOrderByUpdatedDesc(userId, status);
            return  entites.stream().map(this::toDto).collect(Collectors.toList());
    }


    @Transactional(readOnly = true)
    public SavingAccountDto getSavingAccount(Integer userId, Integer id)
            throws ChangeSetPersister.NotFoundException {

        Saving_Account e = savingAccountDao
                .findByIdAndUserId(id, userId)   // ✅ fixed
                .orElseThrow(ChangeSetPersister.NotFoundException::new);

        return toDto(e);
    }
    private SavingAccountDto toDto(Saving_Account e) {
        SavingAccountDto dto = new SavingAccountDto();
        dto.setId(e.getId());
        dto.setUserId(e.getUser() != null ? e.getUser().getId() : null); // ✅ fixed
        dto.setName(e.getName());
        dto.setCurrency(e.getCurrency());
        dto.setStatus(e.getStatus());
        dto.setOpening_balance(e.getOpening_balance());
        dto.setInterestApr(e.getInterestApr());
        dto.setCompounding(e.getCompounding());
        dto.setDay_count_conversion(e.getDay_count_conversion());
        dto.setLast_interest_posted_at(e.getLast_interest_posted_at());
        dto.setNotes(e.getNotes());
        dto.setCreated_at(e.getCreated_at());
        dto.setUpdated_at(e.getUpdated_at());
        dto.setVersion(e.getVersion());
        return dto;
    }
}
