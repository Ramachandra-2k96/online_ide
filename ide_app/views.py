import subprocess
from django.shortcuts import render
from decouple import config
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import os
# Create your views here.
def home(request):
    firebase_config = {
        'apiKey': config('FIREBASE_API_KEY'),
        'authDomain': config('FIREBASE_AUTH_DOMAIN'),
        'projectId': config('FIREBASE_PROJECT_ID'),
        'storageBucket': config('FIREBASE_STORAGE_BUCKET'),
        'messagingSenderId': config('FIREBASE_MESSAGING_SENDER_ID'),
        'appId': config('FIREBASE_APP_ID'),
    }
    return render(request,"index.html",{'firebase_config': firebase_config})

@csrf_exempt
def compile_code(request):
    if request.method == 'POST':
        language = request.POST.get('language', '').lower()
        code = request.POST.get('code', '')

        random_filename = os.path.join("temp", f"{os.urandom(16).hex()}.{language}")
        with open(random_filename, "w") as program_file:
            program_file.write(code)

        output, error = "", ""

        if language == "python":
            python_executable = "venv/bin/python"  # Update this with the correct path
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

