package com.example.spendsnap.service;

import com.example.spendsnap.dao.UserDao;
import com.example.spendsnap.dto.UserDto;
import com.example.spendsnap.model.Role;
import com.example.spendsnap.model.UserModel;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserDao userDao;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    // UserService.java (add overloads using raw strings)
    public UserModel registerUser(String username, String rawPassword) {
        String u = username == null ? "" : username.trim();
        if (u.isEmpty()) throw new IllegalArgumentException("Username is required");
        if (userDao.existsByUsernameIgnoreCase(u)) throw new RuntimeException("Username already exists!");

        UserModel entity = new UserModel();
        entity.setUsername(u);
        entity.setPassword(passwordEncoder.encode(rawPassword)); // hash here
        entity.setRole(Role.USER);
        return userDao.save(entity);
    }

    public String verify(String username, String rawPassword){
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, rawPassword));
        UserModel persisted = userDao.findByUsername(username);
        if (persisted == null) throw new RuntimeException("User not found");
        return jwtService.generateToken(persisted);
    }


    public String verify(UserModel req) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword())
        );

        // If we got here, creds are valid. Build token from persisted user.
        UserModel persisted = userDao.findByUsername(req.getUsername());
        if (persisted == null) {
            throw new RuntimeException("User not found");
        }
        return jwtService.generateToken(persisted);
    }

    public UserModel findUserById(Integer id) {
        return userDao.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
    }

    public UserModel findUserByUsername(String username) {
        return userDao.findByUsername(username);
    }

    public static UserDto toDto(UserModel user) {
        UserDto dto = new UserDto();
        dto.setId(user.getId());
        dto.setUserName(user.getUsername());
        return dto;
    }
}
