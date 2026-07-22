#!/usr/bin/env python3
import os
import sys
import paramiko

HOST = os.getenv("STACKVAULT_HOST", "23.95.10.234")
USER = os.getenv("STACKVAULT_USER", "decohomz")
PASS = os.getenv("STACKVAULT_PASSWORD", "IOMmKRarh45KYXQgRgvT")
REMOTE_DIR = "/home/decohomz/htdocs/stackvault-api"

LOCAL_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

def deploy():
    print(f"Connecting to {USER}@{HOST}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS, timeout=15)

    sftp = ssh.open_sftp()

    def mkdir_p(remote_directory):
        dirs = []
        path = remote_directory
        while path and path != '/':
            dirs.append(path)
            path = os.path.dirname(path)
        for d in reversed(dirs):
            try:
                sftp.stat(d)
            except IOError:
                sftp.mkdir(d)

    mkdir_p(REMOTE_DIR)

    files_to_upload = [
        "package.json",
        "server.js",
        "config/db.js",
        "config/pricing.js",
        "middleware/auth.js",
        "middleware/admin.js",
        "routes/auth.js",
        "routes/products.js",
        "routes/orders.js",
        "routes/balance.js",
        "routes/admin.js",
        "services/prodseller.js",
        "services/wallet.js",
    ]

    for rel_path in files_to_upload:
        local_path = os.path.join(LOCAL_BACKEND_DIR, rel_path)
        remote_path = os.path.join(REMOTE_DIR, rel_path)
        
        if os.path.exists(local_path):
            remote_parent = os.path.dirname(remote_path)
            mkdir_p(remote_parent)
            print(f"Uploading {rel_path} -> {remote_path}")
            sftp.put(local_path, remote_path)

    # Write production .env on server
    env_content = """PORT=3001
JWT_SECRET=stackvault_super_secret_jwt_key_2026_prod
PRODSELLER_API_KEY=psk_5893e0e31af0817550eb1e09b561f8be0256d7d0e57b8c8b
BINANCE_PAY_ID=1120547012
DEPOSIT_MASTER_SECRET=16e459d4b07f3fbd7fa3ef7e0c5bb0970a56e31ae662f9a2fe9faf919c5d3089
ADMIN_EMAIL=admin@stackvault.com
MARKUP_PERCENT=65

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=stackvault
DB_USERNAME=Ahmex
DB_PASSWORD=gXWhxs6qJQBtFEMbyL6L
"""
    remote_env = os.path.join(REMOTE_DIR, ".env")
    print(f"Writing production .env to {remote_env}")
    with sftp.open(remote_env, "w") as f:
        f.write(env_content)

    sftp.close()

    print("\nRunning npm install on server...")
    stdin, stdout, stderr = ssh.exec_command(f"cd {REMOTE_DIR} && npm install --omit=dev")
    stdout.channel.recv_exit_status()
    print(stdout.read().decode('utf-8'))

    print("\nChecking process or starting server...")
    ssh.close()
    print("Deployment upload finished successfully!")

if __name__ == "__main__":
    deploy()
