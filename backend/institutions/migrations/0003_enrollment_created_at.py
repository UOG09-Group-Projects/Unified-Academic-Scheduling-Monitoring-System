from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('institutions', '0002_enrollment_delete_enrolment'),
    ]

    operations = [
        migrations.AlterField(
            model_name='enrollment',
            name='created_at',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
    ]
