#!/usr/bin/env python3
import sys
import os
import argparse
import json
import paramiko

def execute_remote_cmd(host, username, command, password=None, key_path=None, port=22, timeout=15):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    if not key_path:
        default_keys = [
            os.path.expanduser("~/.ssh/id_ed25519"),
            os.path.expanduser("~/.ssh/id_rsa"),
        ]
        for dk in default_keys:
            if os.path.exists(dk):
                key_path = dk
                break

    try:
        connect_kwargs = {
            "hostname": host,
            "port": port,
            "username": username,
            "timeout": timeout
        }
        
        if key_path and os.path.exists(key_path):
            connect_kwargs["key_filename"] = key_path
            
        if password:
            connect_kwargs["password"] = password

        ssh.connect(**connect_kwargs)
        
        stdin, stdout, stderr = ssh.exec_command(command)
        exit_code = stdout.channel.recv_exit_status()
        
        output_str = stdout.read().decode('utf-8', errors='replace')
        error_str = stderr.read().decode('utf-8', errors='replace')
        
        return {
            "success": exit_code == 0,
            "exit_code": exit_code,
            "stdout": output_str,
            "stderr": error_str
        }
    except Exception as e:
        return {
            "success": False,
            "exit_code": -1,
            "stdout": "",
            "stderr": f"SSH Connection Error: {str(e)}"
        }
    finally:
        ssh.close()

def main():
    parser = argparse.ArgumentParser(description="StackVault VPS Deployment Helper.")
    parser.add_argument("command", help="Bash command to execute on production server.")
    parser.add_argument("--user", default=os.getenv("STACKVAULT_USER", "decohomz"), help="SSH username")
    parser.add_argument("--host", default=os.getenv("STACKVAULT_HOST", "23.95.10.234"), help="Remote host IP")
    parser.add_argument("--port", type=int, default=int(os.getenv("STACKVAULT_PORT", "22")), help="SSH port")
    parser.add_argument("--key", default=os.getenv("STACKVAULT_KEY"), help="Private key path")
    parser.add_argument("--password", default=os.getenv("STACKVAULT_PASSWORD"), help="SSH password")
    
    args = parser.parse_args()
    
    password = args.password
    if not password:
        if args.user == "root":
            password = "082q3ZArJmNp4ShoK7"
        else:
            password = "IOMmKRarh45KYXQgRgvT"
            
    result = execute_remote_cmd(
        host=args.host,
        username=args.user,
        command=args.command,
        password=password,
        key_path=args.key,
        port=args.port
    )
    
    print(f"--- REMOTE EXECUTION RESULT ({args.user}@{args.host}) ---")
    print(f"Exit Code: {result['exit_code']}")
    print(f"Success  : {result['success']}")
    print(f"Stdout   :\n{result['stdout']}")
    if result['stderr']:
        print(f"Stderr   :\n{result['stderr']}")
        
    sys.exit(result['exit_code'])

if __name__ == "__main__":
    main()
