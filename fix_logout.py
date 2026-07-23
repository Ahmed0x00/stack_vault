import os
import glob
import re

files = glob.glob('frontend/*.html')

for filepath in files:
    with open(filepath, 'r') as f:
        content = f.read()
    
    # 1. Add logout link to sidebar nav if not exists
    nav_match = """      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0118 0v6"/><path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/></svg>\n      Support\n    </a>"""
    
    if nav_match in content:
        if 'logout-nav-btn' not in content:
            logout_html = """    <a class="nav-item logout-nav-btn" href="#" style="color:#f66161;">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>
      Logout
    </a>"""
            content = content.replace(
                nav_match,
                nav_match + '\n' + logout_html
            )

    # 2. Update JS listener
    old_js = "const logoutLink = document.querySelector('.user-dropdown a[href=\"login.html\"]');"
    new_js = "const logoutLinks = document.querySelectorAll('.user-dropdown a[href=\"login.html\"], .sidebar .logout-nav-btn');"
    
    if old_js in content:
        content = content.replace(old_js, new_js)
        
        old_listener = """  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('sv_token');
      localStorage.removeItem('sv_user');
      window.location.href = 'login.html';
    });
  }"""
        new_listener = """  logoutLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('sv_token');
      localStorage.removeItem('sv_user');
      window.location.href = 'login.html';
    });
  });"""
        content = content.replace(old_listener, new_listener)

    with open(filepath, 'w') as f:
        f.write(content)

print("Done")
