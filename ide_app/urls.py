from django.urls import path
from .views import home,compile_code
urlpatterns = [
    path("",home),
    path('compile_code/', compile_code, name='compile_code'),
]
