import subprocess
from django.shortcuts import render
from decouple import config
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import os
from online_ide.settings import BASE_DIR
def home(request):
    return render(request,"index.html")

import sys
from io import StringIO

@csrf_exempt
def compile_code(request):
    response_data = {}
    
    if request.method == 'POST':
        language = request.POST.get('language', '').lower()
        code_to_execute = request.POST.get('code', '')
        output, error = "", ""

        if language == "python":
            # Use a temporary namespace for code execution
            temp_namespace = {}

            # Redirect stdout and stderr to capture output and error
            sys.stdout = StringIO()
            sys.stderr = StringIO()

            try:
                # Execute the provided Python code
                exec(code_to_execute, temp_namespace)

                # Capture standard output and standard error
                output = sys.stdout.getvalue()
                error = sys.stderr.getvalue()
            except Exception as e:
                error = str(e)
            finally:
                # Reset stdout and stderr
                sys.stdout = sys.__stdout__
                sys.stderr = sys.__stderr__

            response_data = {
                'output': output if output else '',
                'error': error if error else '',
            }

        return JsonResponse(response_data)
    else:
        return JsonResponse({'error': 'Invalid request method'})
