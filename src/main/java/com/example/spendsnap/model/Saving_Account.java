package com.example.spendsnap.model;


import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

@Entity
@Data
@Table( name = "saving_accounts",
        indexes = {
                @Index(name = "idx_saving_accounts_user", columnList = "user_id")
        },
        uniqueConstraints = {
                // optional, but nice: prevent duplicate account names per user
                @UniqueConstraint(name = "uq_saving_accounts_user_name", columnNames = {"user_id","name"})
        })
@NoArgsConstructor
@AllArgsConstructor
public class Saving_Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private  Integer id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false,
            foreignKey = @ForeignKey(name = "fk_saving_accounts_user"))
    UserModel user_id;
    @Column(nullable = false)
    private String name;
    @NotBlank
    @Pattern(regexp = "^[A-Z]{3}$")
    @Column(name = "currency", nullable = false, length = 3)
    private String currency;
    @Enumerated(EnumType.STRING)
    private Status status = Status.ACTIVE;
    private Double opening_balance;
    @NotNull
    @DecimalMin("0.000000")
    @DecimalMax("1.000000")
    @Column(name = "interest_apr", nullable = false, precision = 9, scale = 6)
    private BigDecimal interestApr = BigDecimal.ZERO;
    @Enumerated(EnumType.STRING)
    private Compounding compounding = Compounding.MONTHLY;
    @Enumerated(EnumType.STRING)
    private DayCountConversion day_count_conversion = DayCountConversion.ACT_365F;
    private OffsetDateTime last_interest_posted_at;
    private String notes;
    private OffsetDateTime created_at;
    private OffsetDateTime updated_at;
    @Version
    @Column(name = "version")
    private Integer version;
}
