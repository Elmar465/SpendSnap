package com.example.spendsnap.controller;

import com.example.spendsnap.dto.SavingAccountDto;
import com.example.spendsnap.model.Status;
import com.example.spendsnap.service.SavingAccountService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.jetbrains.annotations.Nullable;
import org.springframework.data.crossstore.ChangeSetPersister;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@RestController
@RequestMapping("/savingAccount")
@RequiredArgsConstructor
@Validated
public class SavingAccountController {

    private final SavingAccountService service;
    private final HttpServletRequest request;

    // --------------------------
    // Create & Read
    // --------------------------

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SavingAccountDto create(@Valid @RequestBody SavingAccountDto body)
            throws ChangeSetPersister.NotFoundException {
        Integer userId = currentUserId();
        // enforce server-side ownership
        body.setUserId(userId);
        return service.createSavingAccount(body);
    }

    @GetMapping
    public List<SavingAccountDto> list(
            @RequestParam(name = "status", required = false) Status status
    ) {
        Integer userId = currentUserId();
        return service.listSavingAccounts(userId, status);
    }

    @GetMapping("/{id}")
    public SavingAccountDto getOne(@PathVariable Integer id)
            throws ChangeSetPersister.NotFoundException {
        Integer userId = currentUserId();
        return service.getSavingAccount(userId, id);
    }

    // --------------------------
    // Update & Lifecycle
    // --------------------------

    @PatchMapping("/{id}")
    public SavingAccountDto update(@PathVariable Integer id,
                                   @Valid @RequestBody SavingAccountDto patch)
            throws ChangeSetPersister.NotFoundException {
        Integer userId = currentUserId();
        return service.updateSavingAccount(userId, id, patch);
    }

    @PostMapping("/{id}/archive")
    public SavingAccountDto archive(@PathVariable Integer id)
            throws ChangeSetPersister.NotFoundException {
        Integer userId = currentUserId();
        return service.archiveSavingAccount(userId, id);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id)
            throws ChangeSetPersister.NotFoundException {
        Integer userId = currentUserId();
        service.deleteSavingAccount(userId, id);
        return ResponseEntity.noContent().build();
    }

    // --------------------------
    // Money Ops
    // --------------------------

    @PostMapping("/{id}/deposit")
    public SavingAccountDto deposit(@PathVariable Integer id,
                                    @Valid @RequestBody MoneyRequest req)
            throws ChangeSetPersister.NotFoundException {
        Integer userId = currentUserId();
        return service.deposit(userId, id, req.getAmount(), req.getMemo());
    }

    @PostMapping("/{id}/withdraw")
    public SavingAccountDto withdraw(@PathVariable Integer id,
                                     @Valid @RequestBody MoneyRequest req)
            throws ChangeSetPersister.NotFoundException {
        Integer userId = currentUserId();
        return service.withdraw(userId, id, req.getAmount(), req.getMemo());
    }

    @PostMapping("/transfer")
    public TransferResult transfer(@Valid @RequestBody TransferRequest req)
            throws ChangeSetPersister.NotFoundException {
        Integer userId = currentUserId();

        // Perform the transfer
        service.transfer(userId, req.getFromId(), req.getToId(), req.getAmount(), req.getMemo());

        // Return both balances after transfer (handy for UI refresh)
        BigDecimal fromBal = service.getBalance(userId, req.getFromId());
        BigDecimal toBal   = service.getBalance(userId, req.getToId());
        TransferResult res = new TransferResult();
        res.setFromId(req.getFromId());
        res.setToId(req.getToId());
        res.setFromBalance(fromBal);
        res.setToBalance(toBal);
        return res;
    }

    // --------------------------
    // Interest
    // --------------------------

    @PostMapping("/{id}/accrue-interest")
    public InterestPostedResponse accrueInterest(@PathVariable Integer id,
                                                 @RequestParam(name = "asOf", required = false)
                                                 @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                                                 OffsetDateTime asOf)
            throws ChangeSetPersister.NotFoundException {
        Integer userId = currentUserId();
        BigDecimal posted = service.accrueInterestIfDue(userId, id, asOf);
        InterestPostedResponse res = new InterestPostedResponse();
        res.setInterestPosted(posted);
        return res;
    }

    @GetMapping("/{id}/preview-interest")
    public InterestPreviewResponse previewInterest(@PathVariable Integer id,
                                                   @RequestParam("from")
                                                   @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                                                   OffsetDateTime from,
                                                   @RequestParam("to")
                                                   @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
                                                   OffsetDateTime to)
            throws ChangeSetPersister.NotFoundException {
        Integer userId = currentUserId();
        BigDecimal interest = service.previewInterest(userId, id, from, to);
        InterestPreviewResponse res = new InterestPreviewResponse();
        res.setInterest(interest);
        return res;
    }

    // --------------------------
    // Utility
    // --------------------------

    @GetMapping("/{id}/balance")
    public BalanceResponse balance(@PathVariable Integer id)
            throws ChangeSetPersister.NotFoundException {
        Integer userId = currentUserId();
        BigDecimal bal = service.getBalance(userId, id);
        BalanceResponse res = new BalanceResponse();
        res.setBalance(bal);
        return res;
    }

    @GetMapping("/{id}/snapshot")
    public SavingAccountDto snapshot(@PathVariable Integer id)
            throws ChangeSetPersister.NotFoundException {
        Integer userId = currentUserId();
        return service.getSnapshot(userId, id);
    }

    // --------------------------
    // Helpers
    // --------------------------

    /**
     * Resolve the authenticated user's id.
     * Replace this with your own principal type (e.g., CustomUserDetails#getId()).
     * As a temporary fallback (when no security yet), it reads "X-User-Id" header.
     */
    private Integer currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            Object p = auth.getPrincipal();
            // If your principal has a getId() method, use reflection safely:
            try {
                Method m = p.getClass().getMethod("getId");
                Object id = m.invoke(p);
                if (id instanceof Number n) return n.intValue();
            } catch (Exception ignored) {}
            // If your principal *is* just a Number
            if (p instanceof Number n) return n.intValue();
        }
        // Fallback for local/dev usage only:
        String header = request.getHeader("X-User-Id");
        if (header != null && !header.isBlank()) {
            try { return Integer.parseInt(header); } catch (NumberFormatException ignored) {}
        }
        throw new AccessDeniedException("Cannot resolve authenticated user id.");
    }

    // --------------------------
    // Request/Response payloads
    // --------------------------

    @Data
    public static class MoneyRequest {
        @NotNull
        private BigDecimal amount;
        @Nullable
        private String memo;
    }

    @Data
    public static class TransferRequest {
        @NotNull
        private Integer fromId;
        @NotNull
        private Integer toId;
        @NotNull
        private BigDecimal amount;
        @Nullable
        private String memo;
    }

    @Data
    public static class TransferResult {
        private Integer fromId;
        private Integer toId;
        private BigDecimal fromBalance;
        private BigDecimal toBalance;
    }

    @Data
    public static class BalanceResponse {
        private BigDecimal balance;
    }

    @Data
    public static class InterestPostedResponse {
        private BigDecimal interestPosted;
    }

    @Data
    public static class InterestPreviewResponse {
        private BigDecimal interest;
    }
}
