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
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {


    private final UserDao userDao;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;


    public UserModel registerUser(UserModel user) {
        if (userDao.findByUsername(user.getUsername()) != null) {
            throw new RuntimeException("Username already exists!");
        }
        user.setPassword(bCryptPasswordEncoder.encode(user.getPassword()));
        if (user.getRole() == null) {
            user.setRole(Role.USER);
        }

        return userDao.save(user);
    }



    public String verify(UserModel user){
        Authentication authentication = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                    user.getUsername(),user.getPassword()));
        if(authentication.isAuthenticated()){
            return jwtService.generateToken(user);
        } else {
            return "fail";
        }
    }

    public UserModel findUserById(Integer id){
        return userDao.findById(id).orElse(new UserModel());
    }

    public UserModel findUserByUsername(String username){
        return userDao.findByUsername(username);
    }

    public static UserDto toDto(UserModel user){
        UserDto userDto = new UserDto();
        userDto.setId(user.getId());
        userDto.setUserName(user.getUsername());
        return userDto;
    }
}
