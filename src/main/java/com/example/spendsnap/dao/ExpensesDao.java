package com.example.spendsnap.dao;

import com.example.spendsnap.model.Expenses;
import com.example.spendsnap.model.UserModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpensesDao extends JpaRepository<Expenses,Integer> {

    List<Expenses> findByUser(UserModel user);
}
