package com.example.spendsnap;


import com.example.spendsnap.dao.UserDao;
import com.example.spendsnap.model.UserModel;
import com.example.spendsnap.service.CustomUserDetailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Repository;

import java.util.Objects;

@Component
@RequiredArgsConstructor
public class CustomUserDetails implements UserDetailsService {

    private final UserDao userDao;


    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
         UserModel userModel = userDao.findByUsername(username);
         if(Objects.isNull(userModel)){
             System.out.println("Username not found");
             throw new UsernameNotFoundException("Username not found");
         }
         return new CustomUserDetailService(userModel);
    }
}
