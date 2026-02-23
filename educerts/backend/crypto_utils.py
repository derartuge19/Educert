import hashlib
import json
from jose import jws
from jose.constants import ALGORITHMS

# We will use HS256 for simplicity in this demo, but for a real "OpenCerts" like structure
# you'd use asymmetric keys (RSA/ECDSA). Let's simulate that with a shared secret or
# generated keys if we want to go full robust.
# For this implementation, let's use a generated RSA key pair for the issuer.

from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization
import base64

# Load or generate a persistent issuer key
import os

KEY_FILE = "issuer_private_key.pem"

if os.path.exists(KEY_FILE):
    with open(KEY_FILE, "rb") as f:
        private_key = serialization.load_pem_private_key(f.read(), password=None)
else:
    private_key = ed25519.Ed25519PrivateKey.generate()
    with open(KEY_FILE, "wb") as f:
        f.write(private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ))

public_key = private_key.public_key()

def get_public_key_pem():
    return public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf-8')

def hash_data(data: dict) -> bytes:
    """Canonicalize and hash the data dictionary."""
    # Sort keys to ensure consistent ordering for hashing
    canonical_json = json.dumps(data, sort_keys=True, separators=(',', ':'))
    digest = hashlib.sha256(canonical_json.encode('utf-8')).digest()
    return digest

def sign_data(data_str: str) -> str:
    """Sign a string (usually the Merkle Root) using the issuer's private key."""
    signature = private_key.sign(data_str.encode('utf-8'))
    return base64.b64encode(signature).decode('utf-8')

def verify_signature(data_str: str, signature_b64: str) -> bool:
    """Verify the signature against the data using the issuer's public key."""
    try:
        signature = base64.b64decode(signature_b64)
        public_key.verify(signature, data_str.encode('utf-8'))
        return True
    except Exception:
        return False
