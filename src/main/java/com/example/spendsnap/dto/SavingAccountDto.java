package com.example.spendsnap.dto;


import com.example.spendsnap.model.Compounding;
import com.example.spendsnap.model.DayCountConversion;
import com.example.spendsnap.model.Status;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SavingAccountDto {


    //Server- managed fields (read-only to clients)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Integer id;
    @NotNull(message = "User id is required")
    private Integer userId;
    @Size(max = 120)
    private String name;
    @NotBlank
    @Pattern(regexp = "^[A-Z]{3}$")
    @Column(name = "currency", nullable = false, length = 3)
    @Positive(message = "Number cannot be negative")
    @Pattern(regexp = "^[A-Z]{3}$", message = "currency must be 3-letter ISO code (e.g. USD)")
    private String currency;
    private Status status = Status.ACTIVE;
    private Double opening_balance;
    @NotNull
    @DecimalMin("0.000000")
    @DecimalMax("1.000000")
    private BigDecimal interestApr = BigDecimal.ZERO;
    private Compounding compounding = Compounding.MONTHLY;
    private OffsetDateTime last_interest_posted_at;
    @Size(max = 2000)
    private String notes;
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private OffsetDateTime created_at;
    @Enumerated(EnumType.STRING)
    private DayCountConversion day_count_conversion = DayCountConversion.ACT_365F;
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private OffsetDateTime updated_at;
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    private Integer version;


}
