package com.example.spendsnap.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// dto/LoginRequest.java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    @NotBlank private String username;
    @NotBlank private String password;
}
