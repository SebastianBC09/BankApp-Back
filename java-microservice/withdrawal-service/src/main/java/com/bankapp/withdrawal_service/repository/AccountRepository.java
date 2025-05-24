package com.bankapp.withdrawal_service.repository;

import com.bankapp.withdrawal_service.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByIdAndUserId(Long id, Long userId);
}
