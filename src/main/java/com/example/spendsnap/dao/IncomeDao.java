package com.example.spendsnap.dao;

import com.example.spendsnap.model.IncomeModel;
import com.example.spendsnap.model.UserModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncomeDao  extends JpaRepository<IncomeModel, Integer> {

    List<IncomeModel> findByUser(UserModel user);
    @Query("SELECT SUM(i.amount) FROM IncomeModel i WHERE i.user.id = :userId")
    Double getTotalIncomeByUser(@Param("userId") Integer userId);

    @Query("SELECT SUM(i.amount) FROM IncomeModel i WHERE i.user.id = :userId AND MONTH(i.date) = :month AND YEAR(i.date) = :year")
    Double getMonthlyIncomeSumByUser(@Param("userId") Integer userId, @Param("month") int month, @Param("year") int year);

    @Query("SELECT i FROM IncomeModel i WHERE i.user.id = :userId AND MONTH(i.date) = :month AND YEAR(i.date) = :year")
    List<IncomeModel> getMonthlyIncomeByUser(@Param("userId") Integer userId, @Param("month") int month, @Param("year") int year);


}