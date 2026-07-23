import glob

files = glob.glob('frontend/*.html')

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Change top-user to not navigate
    old_top = '<a class="top-user" href="my_account.html" title="Account menu">'
    new_top = '<a class="top-user" tabindex="0" role="button" title="Account menu">'
    content = content.replace(old_top, new_top)
    
    with open(filepath, 'w') as f:
        f.write(content)

print("Done")
