package com.example.spendsnap.model;


import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IncomeModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    private Double amount;
    private String description;
    private LocalDate date;
    private String category;
    @ManyToOne
    @JoinColumn(name = "user_id")
    private UserModel user;


}
