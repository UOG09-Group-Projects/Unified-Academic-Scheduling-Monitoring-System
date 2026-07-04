from django.test import RequestFactory, TestCase

from institutions.jwt_utils import generate_tokens, get_user_from_token
from institutions.models import User


class JwtAuthTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    def test_get_user_from_token_uses_the_user_from_the_bearer_token(self):
        first_user = User.objects.create(
            username='first-user',
            email='first@example.com',
            role='OWNER',
        )
        second_user = User.objects.create(
            username='second-user',
            email='second@example.com',
            role='SUPER_ADMIN',
        )

        token = generate_tokens(second_user)['access']
        request = self.factory.get('/api/dashboard/super-admin/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {token}'

        self.assertEqual(get_user_from_token(request), second_user)
        self.assertNotEqual(get_user_from_token(request), first_user)

    def test_get_user_from_token_returns_none_without_authorization_header(self):
        request = self.factory.get('/api/dashboard/super-admin/')

        self.assertIsNone(get_user_from_token(request))
