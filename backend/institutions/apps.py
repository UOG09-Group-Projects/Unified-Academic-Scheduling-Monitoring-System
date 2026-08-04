from django.apps import AppConfig


class InstitutionsConfig(AppConfig):
    name = 'institutions'

    def ready(self):
        from . import scheduler
        scheduler.start()
