package com.bankapp.balance_service.repository;

import com.bankapp.balance_service.model.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByIdAndUserId(Long id, Long userId);
}
