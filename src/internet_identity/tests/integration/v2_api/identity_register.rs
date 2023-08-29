use crate::v2_api::authn_method_test_helpers::{
    create_identity_with_authn_method, test_authn_method,
};
use canister_tests::api::internet_identity::api_v2;
use canister_tests::framework::{
    arg_with_anchor_range, env, install_ii_canister, install_ii_canister_with_arg, II_WASM,
};
use canister_tests::match_value;
use internet_identity_interface::internet_identity::types::{
    CaptchaCreateResponse, ChallengeAttempt, IdentityRegisterResponse,
};

#[test]
fn should_register_new_identity() {
    let env = env();
    let canister_id =
        install_ii_canister_with_arg(&env, II_WASM.clone(), arg_with_anchor_range((42, 44)));
    let authn_method = test_authn_method();
    let identity_number = create_identity_with_authn_method(&env, canister_id, &authn_method);

    assert_eq!(identity_number, 42);
}

#[test]
fn should_register_multiple_identities() {
    let env = env();
    let canister_id = install_ii_canister(&env, II_WASM.clone());
    let authn_method = test_authn_method();
    let identity_number_1 = create_identity_with_authn_method(&env, canister_id, &authn_method);
    let identity_number_2 = create_identity_with_authn_method(&env, canister_id, &authn_method);

    assert_ne!(identity_number_1, identity_number_2);
}

#[test]
fn should_not_exceed_configured_identity_range() {
    let env = env();
    let canister_id =
        install_ii_canister_with_arg(&env, II_WASM.clone(), arg_with_anchor_range((42, 44)));

    let authn_method = test_authn_method();
    create_identity_with_authn_method(&env, canister_id, &authn_method);
    create_identity_with_authn_method(&env, canister_id, &authn_method);

    match_value!(
        api_v2::captcha_create(&env, canister_id).unwrap(),
        Some(CaptchaCreateResponse::Ok(challenge))
    );

    match_value!(
        api_v2::identity_register(
            &env,
            canister_id,
            authn_method.principal(),
            &authn_method,
            &ChallengeAttempt {
                chars: "a".to_string(),
                key: challenge.challenge_key,
            },
            None,
        ),
        Ok(Some(IdentityRegisterResponse::CanisterFull))
    );
}
