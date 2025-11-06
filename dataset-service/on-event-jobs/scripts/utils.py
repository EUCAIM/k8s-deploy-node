import subprocess
import shlex

def execute_cmd(cmd_string, fetch=True):
    '''
    fetch: if True, return a list. Otherwise, return string
    '''
    print ('Executing "' + cmd_string + '"...' )
    args = shlex.split(cmd_string)
    p = subprocess.Popen(args, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    out, err = p.communicate()
    rc = p.returncode
    output = err
    if rc == 0:
        output = out
    if fetch:
        output = output.split('\n')
    return output, rc 
