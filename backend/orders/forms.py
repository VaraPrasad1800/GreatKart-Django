from django import forms


class CheckoutForm(forms.Form):
    """Shipping details captured at checkout (mirrors API CheckoutSerializer)."""
    full_name = forms.CharField(max_length=100)
    phone = forms.CharField(max_length=15)
    email = forms.EmailField(max_length=50)
    address_line_1 = forms.CharField(max_length=100)
    address_line_2 = forms.CharField(max_length=100, required=False)
    city = forms.CharField(max_length=50)
    state = forms.CharField(max_length=50)
    country = forms.CharField(max_length=50)
    pincode = forms.CharField(max_length=10)

    def __init__(self, *args, **kwargs):
        super(CheckoutForm, self).__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs['class'] = 'form-control'
            field.widget.attrs['placeholder'] = field.label

    def clean_phone(self):
        phone = self.cleaned_data.get('phone')
        if phone and (not phone.isdigit() or len(phone) != 10):
            raise forms.ValidationError('Phone number must be exactly 10 digits.')
        return phone