package com.example.spendsnap.dao;

import com.example.spendsnap.model.Expenses;
import com.example.spendsnap.model.UserModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExpensesDao extends JpaRepository<Expenses,Integer> {

    List<Expenses> findByUser(UserModel user);

    @Query("SELECT SUM(e.amount) FROM Expenses e WHERE e.user.id = :userId")
    Double getTotalExpensesByUser(@Param("userId") Integer userId);

    @Query("SELECT SUM(e.amount) FROM Expenses e WHERE e.user.id = :userId AND MONTH(e.date) = :month AND YEAR(e.date) = :year")
    Double getMonthlyExpensesSumByUser(@Param("userId") Integer userId, @Param("month") int month, @Param("year") int year);

    @Query("SELECT e FROM Expenses e WHERE e.user.id = :userId AND MONTH(e.date) = :month AND YEAR(e.date) = :year")
    List<Expenses> getMonthlyExpensesByUser(@Param("userId") Integer userId, @Param("month") int month, @Param("year") int year);

}
