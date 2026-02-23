from auth_utils import get_password_hash
try:
    p = "ed1234"
    h = get_password_hash(p)
    print(f"Hash successful: {h}")
except Exception as e:
    print(f"Hash failed: {e}")
    import traceback
    traceback.print_exc()
