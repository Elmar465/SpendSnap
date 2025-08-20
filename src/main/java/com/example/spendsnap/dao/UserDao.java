package com.example.spendsnap.dao;

import com.example.spendsnap.model.UserModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface UserDao extends JpaRepository<UserModel,Integer> {


    UserModel findByUsername(String username);
    boolean existsByUsernameIgnoreCase(String username);
}
