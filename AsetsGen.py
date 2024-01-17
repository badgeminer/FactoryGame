import os
import sys

rootdir = 'assets/'
outJS = "const assets = {\n"
outHtml = ""
for root, subFolders, files in os.walk(rootdir):
        for folder in subFolders:
            pass

        for file in files:
            file_path = os.path.join(root, file)
            outHtml += f'\t<img src="{file_path}" id="{file.removesuffix(".png")}">\n'
            outJS += f'\t"{file.removesuffix(".png")}":document.getElementById("{file.removesuffix(".png")}") || errImg,\n'

with open("out.html","w") as f:
    f.write(outHtml)
with open("out.js","w") as f:
    f.write(outJS+"}")