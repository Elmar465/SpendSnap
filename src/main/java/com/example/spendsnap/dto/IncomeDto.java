package com.example.spendsnap.dto;


import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IncomeDto {

    private Integer id;
    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be positive")
    private Double amount;
    @NotBlank(message = "Description is required")
    private String description;
    @NotNull(message = "Date is required")
    private LocalDate date;
    @NotBlank(message = "Category is required")
    private String category;
    @NotNull(message = "User ID is required")
    private Integer userId;
}
