import subprocess
from django.shortcuts import render
from decouple import config
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import os
from online_ide.settings import BASE_DIR
def home(request):
    return render(request,"index.html")

@csrf_exempt
def compile_code(request):
    response_data={}
    if request.method == 'POST':
        language = request.POST.get('language', '').lower()
        code = request.POST.get('code', '')
        output, error = "", ""
        if language == "python":
            random_filename = os.path.join(os.path.join(BASE_DIR,"temp"), f"{os.urandom(16).hex()}.{language}")
            with open(random_filename, "w") as program_file:
                program_file.write(code)
            python_executable = os.path.join(BASE_DIR,"venv/bin/python")  
            command = [python_executable, random_filename]
            process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            output, error = process.communicate()
            output = output.decode('utf-8')
            error = error.decode('utf-8')
            # Clean up: Delete the temporary file
            os.remove(random_filename)

            response_data = {
                'command': ' '.join(command) if command else '',
                'output': output if output else '',
                'error': error if error else '',
            }

        return JsonResponse(response_data)
    else:
        return JsonResponse({'error': 'Invalid request method'})

