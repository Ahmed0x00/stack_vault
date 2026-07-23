import os
import paramiko

HOST = "23.95.10.234"
USER = "decohomz"
PASS = "IOMmKRarh45KYXQgRgvT"

def upload():
    print(f"Connecting to {USER}@{HOST}...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASS)

    sftp = ssh.open_sftp()
    
    # 1. Upload bot pricing.py
    print("Uploading bot pricing.py...")
    sftp.put(
        "/home/ahmex/StackVault Bot/pricing.py", 
        "/home/decohomz/htdocs/stackvault-bot/pricing.py"
    )
    
    # 2. Upload backend API pricing.js
    print("Uploading backend pricing.js...")
    sftp.put(
        "/home/ahmex/StackVault Website/backend/config/pricing.js", 
        "/home/decohomz/htdocs/stackvault-api/config/pricing.js"
    )
    
    sftp.close()
    
    print("Restarting bot...")
    ssh.exec_command('cd /home/decohomz/htdocs/stackvault-bot && ./start.sh')
    
    print("Restarting backend API...")
    ssh.exec_command('pkill -9 node || true && cd /home/decohomz/htdocs/stackvault-api && nohup node server.js > server.log 2>&1 &')
    
    ssh.close()
    print("Done!")

if __name__ == "__main__":
    upload()
