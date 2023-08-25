use crate::v2_api::authn_method_test_helpers::{
    create_identity_with_authn_method, test_authn_method,
};
use canister_tests::framework::{
    arg_with_anchor_range, env, install_ii_canister_with_arg, II_WASM,
};
use ic_test_state_machine_client::CallError;

/// Tests user registration with cross checks for get_anchor_credentials, get_anchor_info and get_principal.
#[test]
fn should_register_new_anchor() -> Result<(), CallError> {
    let env = env();
    let canister_id =
        install_ii_canister_with_arg(&env, II_WASM.clone(), arg_with_anchor_range((1, 2)));
    let authn_method = test_authn_method();
    let user_number = create_identity_with_authn_method(&env, canister_id, &authn_method);
    assert_eq!(user_number, 1);
    Ok(())
}
