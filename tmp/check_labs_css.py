import urllib.request
import gzip
import re

headers = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"}
req = urllib.request.Request("https://labs.google/", headers=headers)
with urllib.request.urlopen(req) as resp:
    data = resp.read()
    try:
        data = gzip.decompress(data)
    except Exception:
        pass
    text = data.decode("utf-8", "ignore")

# Find style or css links
css_links = re.findall(r'href="([^"]+\.css[^"]*)"', text)
print("CSS links:", css_links)

# Check inline style tags
style_tags = re.findall(r'<style[^>]*>(.*?)</style>', text, re.DOTALL)
for st in style_tags:
    for m in re.finditer(r'(\.[^{}]*header[^{}]*\{[^{}]*\})', st):
        if 'blur' in m.group(1) or 'mask' in m.group(1) or 'container' in m.group(1) or 'tint' in m.group(1):
            print("Inline match:", m.group(1))

# Check linked CSS files for .header__blur
for link in css_links:
    full_url = link if link.startswith("http") else "https://labs.google" + link
    try:
        req2 = urllib.request.Request(full_url, headers=headers)
        with urllib.request.urlopen(req2) as r2:
            cdata = r2.read()
            try:
                cdata = gzip.decompress(cdata)
            except Exception:
                pass
            ctext = cdata.decode("utf-8", "ignore")
            for m in re.finditer(r'(\.[^{}]*header__blur[^{}]*\{[^{}]*\})', ctext):
                print("External CSS blur match:", m.group(1))
            for m in re.finditer(r'(\.[^{}]*header\b[^{}]*\{[^{}]*\})', ctext):
                if 'blur' in m.group(1) or 'mask' in m.group(1) or 'background' in m.group(1):
                    print("External header match:", m.group(1))
    except Exception as e:
        print("Error fetching link:", link, e)
