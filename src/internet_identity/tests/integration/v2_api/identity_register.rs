use crate::v2_api::authn_method_test_helpers::{
    create_identity_with_authn_method, test_authn_method,
};
use canister_tests::framework::{
    arg_with_anchor_range, env, install_ii_canister, install_ii_canister_with_arg, II_WASM,
};
use ic_test_state_machine_client::CallError;

#[test]
fn should_register_new_identity() {
    let env = env();
    let canister_id =
        install_ii_canister_with_arg(&env, II_WASM.clone(), arg_with_anchor_range((1, 2)));
    let authn_method = test_authn_method();
    let identity_number = create_identity_with_authn_method(&env, canister_id, &authn_method);

    assert_eq!(identity_number, 1);
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
