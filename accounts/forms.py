from django import forms
from .models import Account

class RegisterForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput(attrs={
        'placeholder' : 'Enter Password'
    }))

    confirm_password = forms.CharField(widget=forms.PasswordInput(attrs={
        'placeholder' : 'Confirm Password'
    }))
    class Meta:
        model = Account
        fields = ['first_name','last_name','phone_number','email','password']

    def __ini__(self,*args,**kwargs):
        super(RegisterForm,self).__init__(*args,**kwargs)
        for field in self.fields:
            self.fields[field].widget.attrs['class'] = 'form-control'

    def clean(self):
        cleaned_data = super().clean()

        password = cleaned_data.get("password")
        confirm_password = cleaned_data.get("confirm_password")

        if password != confirm_password:
            self.add_error(
                "confirm_password",
                "Passwords do not match."
            )

        phone = cleaned_data.get("phone_number")

        if phone:
            if not phone.isdigit():
                self.add_error(
                    "phone_number",
                    "Phone number must contain only digits."
                )

            elif len(phone) != 10:
                self.add_error(
                    "phone_number",
                    "Phone number must be exactly 10 digits."
                )

        return cleaned_data


class LoginForm(forms.Form):

    email = forms.EmailField(
        widget=forms.EmailInput(attrs={
        'placeholder' : 'Email Address'
        })
    )

    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'placeholder' : 'Password'
        })
    )

    