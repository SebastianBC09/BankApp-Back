package com.bankapp.deposit_service.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "users", schema = "bankapp", indexes = {
        @Index(name = "idx_users_auth0_id_unique", columnList = "auth0_id", unique = true),
        @Index(name = "idx_users_email_unique", columnList = "email", unique = true)
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Size(max = 255)
    @NotNull
    @Column(name = "auth0_id", nullable = false)
    private String auth0Id;

    @Size(max = 100)
    @NotNull
    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Size(max = 100)
    @NotNull
    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Size(max = 255)
    @NotNull
    @Column(name = "email", nullable = false)
    private String email;

    @ColumnDefault("false")
    @Column(name = "email_verified")
    private Boolean emailVerified;

    @Size(max = 10)
    @Column(name = "phone_country_code", length = 10)
    private String phoneCountryCode;

    @Size(max = 50)
    @Column(name = "phone_number", length = 50)
    private String phoneNumber;

    @ColumnDefault("false")
    @Column(name = "phone_is_verified")
    private Boolean phoneIsVerified;

    @Size(max = 255)
    @Column(name = "address_street")
    private String addressStreet;

    @Size(max = 100)
    @Column(name = "address_apartment_or_unit", length = 100)
    private String addressApartmentOrUnit;

    @Size(max = 100)
    @Column(name = "address_city", length = 100)
    private String addressCity;

    @Size(max = 100)
    @Column(name = "address_state_or_department", length = 100)
    private String addressStateOrDepartment;

    @Size(max = 20)
    @Column(name = "address_zip_code", length = 20)
    private String addressZipCode;

    @Size(max = 5)
    @ColumnDefault("'CO'")
    @Column(name = "address_country", length = 5)
    private String addressCountry;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Size(max = 100)
    @Column(name = "nationality", length = 100)
    private String nationality;

    @Size(max = 20)
    @Column(name = "identification_document_type", length = 20)
    private String identificationDocumentType;

    @Size(max = 50)
    @Column(name = "identification_document_number", length = 50)
    private String identificationDocumentNumber;

    @Column(name = "identification_document_issue_date")
    private LocalDate identificationDocumentIssueDate;

    @Column(name = "identification_document_expiry_date")
    private LocalDate identificationDocumentExpiryDate;

    @Size(max = 50)
    @NotNull
    @ColumnDefault("'pending_verification'")
    @Column(name = "status", nullable = false, length = 50)
    private String status;

    @Size(max = 50)
    @Column(name = "agreed_to_terms_version", length = 50)
    private String agreedToTermsVersion;

    @Size(max = 10)
    @ColumnDefault("'es'")
    @Column(name = "preferences_language", length = 10)
    private String preferencesLanguage;

    @ColumnDefault("true")
    @Column(name = "preferences_notifications_email")
    private Boolean preferencesNotificationsEmail;

    @ColumnDefault("false")
    @Column(name = "preferences_notifications_sms")
    private Boolean preferencesNotificationsSms;

    @ColumnDefault("true")
    @Column(name = "preferences_notifications_push")
    private Boolean preferencesNotificationsPush;

    @Column(name = "last_login_at")
    private OffsetDateTime lastLoginAt;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @NotNull
    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "user")
    private Set<Account> accounts = new LinkedHashSet<>();

    @ManyToMany
    @JoinTable(name = "user_roles",
            joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "role_id"))
    private Set<Role> roles = new LinkedHashSet<>();

}
