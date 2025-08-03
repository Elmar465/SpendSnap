package com.example.spendsnap.controller;


import com.example.spendsnap.dto.UserDto;
import com.example.spendsnap.model.UserModel;
import com.example.spendsnap.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.apache.catalina.User;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import static com.example.spendsnap.service.UserService.toDto;

@RestController
@RequestMapping("/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService  userService;


    @PostMapping("/register")
    public ResponseEntity<UserDto> registerUser(@RequestBody @Valid UserModel user){
        UserModel userModel = userService.registerUser(user);
        UserDto userDto = toDto(userModel);
        return new ResponseEntity<>(userDto, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public String login(@RequestBody @Valid UserModel user){
        return userService.verify(user);
    }



    @GetMapping("/getUserById/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable Integer id){
        UserModel getUserId =  userService.findUserById(id);
        UserDto userDto = toDto(getUserId);
        return new ResponseEntity<>(userDto, HttpStatus.OK);
    }

    @GetMapping("/getUserByName")
    public ResponseEntity<UserDto> getUserByName(@RequestParam String name){
        UserModel userModel = userService.findUserByUsername(name);
        UserDto userDto = toDto(userModel);
        return new ResponseEntity<>(userDto, HttpStatus.OK);
    }
}
