package com.example.spendsnap.dao;

import com.example.spendsnap.model.Saving_Account;
import com.example.spendsnap.model.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavingAccountDao extends JpaRepository<Saving_Account, Integer> {

   // REMOVE the bad method: Optional<Saving_Account> findIdAndUser_id(...)

   // If your entity field is 'user' (recommended), traverse s.user.id:
   @Query("select s from Saving_Account s where s.id = :id and s.user.id = :userId")
   Optional<Saving_Account> findByIdAndUserId(@Param("id") Integer id,
                                              @Param("userId") Integer userId);

   // Name uniqueness (used on create)
   // You may keep either this derived method OR the JPQL versions below; both are fine.
   boolean existsByUser_IdAndNameIgnoreCase(Integer userId, String name);

   // Uniqueness on update (exclude current id)
   @Query("select (count(s) > 0) from Saving_Account s " +
           "where s.user.id = :userId and lower(s.name) = lower(:name) and s.id <> :excludeId")
   boolean existsByUserIdAndNameIgnoreCaseAndIdNot(@Param("userId") Integer userId,
                                                   @Param("name") String name,
                                                   @Param("excludeId") Integer excludeId);

   // Listing (newest first)
   @Query("select s from Saving_Account s " +
           "where s.user.id = :userId " +
           "order by s.updated_at desc")
   List<Saving_Account> findAllByUserIdOrderByUpdatedDesc(@Param("userId") Integer userId);

   @Query("select s from Saving_Account s " +
           "where s.user.id = :userId and s.status = :status " +
           "order by s.updated_at desc")
   List<Saving_Account> findAllByUserIdAndStatusOrderByUpdatedDesc(@Param("userId") Integer userId,
                                                                   @Param("status") Status status);
}
