import hashlib
import json
import uuid
import secrets
from typing import Dict, Any, List, Tuple

def flatten_dict(d: Dict[str, Any], parent_key: str = '', sep: str = '.') -> Dict[str, Any]:
    """Flatten a nested dictionary for OA standard processing."""
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

def salt_and_hash_field(key: str, value: Any) -> Tuple[str, str]:
    """
    Apply OA-style salting and hashing to a single field.
    Format: hash(salt:key:value)
    """
    salt = secrets.token_hex(16)
    # OA standard format often uses a specific string representation
    # We'll use a simplified version: salt:key:value
    # Cast value to string for consistent hashing
    data_str = f"{salt}:{key}:{str(value)}"
    field_hash = hashlib.sha256(data_str.encode('utf-8')).hexdigest()
    return salt, field_hash

def salt_document(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Takes a raw document and returns a salted version.
    The output is a dictionary where each value is replaced by { "salt": ..., "value": ... }
    """
    flattened = flatten_dict(data)
    salted_doc = {}
    for key, value in flattened.items():
        salt = secrets.token_hex(16)
        salted_doc[key] = {
            "salt": salt,
            "value": value
        }
    return salted_doc

def get_field_hashes(salted_doc: Dict[str, Dict[str, Any]]) -> List[str]:
    """Calculate hashes for each salted field."""
    hashes = []
    for key, item in salted_doc.items():
        # OA v2 style: hash(salt:key:value)
        data_str = f"{item['salt']}:{key}:{str(item['value'])}"
        h = hashlib.sha256(data_str.encode('utf-8')).hexdigest()
        hashes.append(h)
    return sorted(hashes)

def calculate_merkle_root(hashes: List[str]) -> str:
    """Calculate the Merkle Root of a list of hashes."""
    if not hashes:
        return ""
    
    current_layer = hashes
    while len(current_layer) > 1:
        next_layer = []
        if len(current_layer) % 2 != 0:
            current_layer.append(current_layer[-1])
            
        for i in range(0, len(current_layer), 2):
            combined = sorted([current_layer[i], current_layer[i+1]])
            combined_str = combined[0] + combined[1]
            next_layer.append(hashlib.sha256(combined_str.encode('utf-8')).hexdigest())
        current_layer = next_layer
        
    return current_layer[0]

def get_merkle_proof(hashes: List[str], target_hash: str) -> List[str]:
    """
    Generate a Merkle Proof (list of sibling hashes) for a target hash.
    Standard OA/Merkle verification requires this path.
    """
    if target_hash not in hashes:
        return []
    
    proof = []
    current_layer = hashes
    current_hash = target_hash
    
    while len(current_layer) > 1:
        next_layer = []
        if len(current_layer) % 2 != 0:
            current_layer.append(current_layer[-1])
            
        for i in range(0, len(current_layer), 2):
            h1, h2 = current_layer[i], current_layer[i+1]
            # Determine combined hash for the next layer
            combined = sorted([h1, h2])
            combined_str = combined[0] + combined[1]
            parent_hash = hashlib.sha256(combined_str.encode('utf-8')).hexdigest()
            next_layer.append(parent_hash)
            
            # If our current_hash is one of these siblings, the other is the proof element
            if h1 == current_hash:
                proof.append(h2)
                current_hash = parent_hash
            elif h2 == current_hash:
                proof.append(h1)
                current_hash = parent_hash
                
        current_layer = next_layer
        
    return proof

def wrap_document(data: Dict[str, Any], issuers: List[Dict[str, Any]], version: str = "2.1") -> Dict[str, Any]:
    """
    Full OA wrapping process aligned with OpenCerts 2.1:
    1. Prepare document data with issuers and recipient info
    2. Salt fields
    3. Hash fields
    4. Calculate Merkle Root
    5. Return OA-compliant document with targetHash and Proof
    """
    full_data = {
        **data,
        "issuers": issuers
    }
    
    salted_data = salt_document(full_data)
    field_hashes = get_field_hashes(salted_data)
    merkle_root = calculate_merkle_root(field_hashes)
    
    # In OA 2.0, each wrapped document is essentially its own Merkle Root 
    # if it's not part of a larger batch. If it IS part of a batch, 
    # the targetHash is the doc's root, and the merkleRoot is the batch's root.
    
    return {
        "version": f"https://schema.opencerts.io/transcripts/{version}",
        "data": salted_data,
        "signature": {
            "type": "SHA3MerkleProof",
            "targetHash": merkle_root,
            "proof": [], # Single doc = empty proof
            "merkleRoot": merkle_root
        }
    }

def obfuscate_document(wrapped_doc: Dict[str, Any], keys_to_obfuscate: List[str]) -> Dict[str, Any]:
    """
    Implements Data Obfuscation (Privacy).
    Removes keys from 'data' but keeps their hashes in 'privacySections' 
    so the Merkle Root remains valid.
    """
    new_doc = json.loads(json.dumps(wrapped_doc)) # deep copy
    data = new_doc.get("data", {})
    privacy_sections = new_doc.get("privacySections", [])
    
    for key in keys_to_obfuscate:
        if key in data:
            # Hash the field correctly as OA would (salt:key:value)
            field_data = data[key]
            data_str = f"{field_data['salt']}:{key}:{str(field_data['value'])}"
            h = hashlib.sha256(data_str.encode('utf-8')).hexdigest()
            
            # Move hash to privacySections and remove from data
            privacy_sections.append(h)
            del data[key]
            
    new_doc["privacySections"] = privacy_sections
    return new_doc

def verify_merkle_proof(target_hash: str, proof: List[str], merkle_root: str) -> bool:
    """
    Verify that a target_hash belongs to a Merkle Root using its proof path.
    """
    current_hash = target_hash
    for sibling in proof:
        combined = sorted([current_hash, sibling])
        combined_str = combined[0] + combined[1]
        current_hash = hashlib.sha256(combined_str.encode('utf-8')).hexdigest()
    
    return current_hash == merkle_root
