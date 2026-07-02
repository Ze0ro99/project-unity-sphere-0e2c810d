# cybersecurity-module/respond.py
import subprocess

# Fixed allowlist of incident categories. Anything else is rejected before any
# shell/OS work happens, preventing shell injection through incident_type.
_ALLOWED_INCIDENTS = {'malware', 'ddos', 'other'}


def respond_to_incident(incident_type):
    if incident_type not in _ALLOWED_INCIDENTS:
        raise ValueError(f"Unknown incident_type: {incident_type!r}")

    if incident_type == 'malware':
        # Run antivirus software — argument list, shell=False.
        subprocess.run(['antivirus', '-scan', '-remove'], shell=False, check=False)
    elif incident_type == 'ddos':
        # Configure firewall rules — argument list, shell=False.
        subprocess.run(['firewall', '-configure', '-block', 'ip_address'], shell=False, check=False)
    else:
        # Log incident via argv (no shell interpretation) and notify.
        # incident_type is already validated against the allowlist above.
        subprocess.run(['logger', f"Incident detected: {incident_type}"], shell=False, check=False)
        subprocess.run(['notify_security_team'], shell=False, check=False)
