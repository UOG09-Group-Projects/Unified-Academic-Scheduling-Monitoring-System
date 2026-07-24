from institutions.views import JWTView
from institutions.models import Complaint, ContactInquiry
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import ComplaintSerializer, ContactInquirySerializer
from .services import ComplaintService, ContactInquiryService


class ComplaintListCreateView(JWTView):

    def get(self, request):
        user = request.current_user
        role = user.role.name.upper()

        if role == 'SUPER_ADMIN':
            complaints = ComplaintService.list_all(
                status=request.query_params.get('status'),
                type=request.query_params.get('type'),
            )
        else:
            complaints = ComplaintService.list_for_user(user)

        serializer = ComplaintSerializer(complaints, many=True)
        return Response(serializer.data)

    def post(self, request):
        user = request.current_user
        if user.role.name.upper() == 'SUPER_ADMIN':
            return Response(
                {'error': 'Super admins cannot file help requests.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            complaint = ComplaintService.create(request.data, user)
            serializer = ComplaintSerializer(complaint)
            return Response(
                {'message': 'Message submitted successfully.', 'data': serializer.data},
                status=status.HTTP_201_CREATED,
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ComplaintDetailView(JWTView):
    allowed_roles = ['SUPER_ADMIN']

    def get_object(self, pk):
        try:
            return Complaint.objects.select_related(
                'submitted_by', 'submitted_by__role', 'replied_by'
            ).get(pk=pk)
        except Complaint.DoesNotExist:
            return None

    def put(self, request, pk):
        complaint = self.get_object(pk)
        if not complaint:
            return Response({'error': 'Message not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            updated = ComplaintService.respond(complaint, request.data, request.current_user)
            serializer = ComplaintSerializer(updated)
            return Response({'message': 'Response sent.', 'data': serializer.data})
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    patch = put


class ComplaintStatsView(JWTView):
    allowed_roles = ['SUPER_ADMIN']

    def get(self, request):
        return Response(ComplaintService.stats())


class ContactInquiryPublicCreateView(APIView):
    """
    Public, unauthenticated: the landing page's contact form. Anyone can
    submit one — there's no LightLearn account involved.
    """

    def post(self, request):
        try:
            inquiry = ContactInquiryService.create(request.data)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        serializer = ContactInquirySerializer(inquiry)
        return Response(
            {'message': 'Message submitted successfully.', 'data': serializer.data},
            status=status.HTTP_201_CREATED,
        )


class ContactInquiryListView(JWTView):
    allowed_roles = ['SUPER_ADMIN']

    def get(self, request):
        inquiries = ContactInquiryService.list_all(status=request.query_params.get('status'))
        serializer = ContactInquirySerializer(inquiries, many=True)
        return Response(serializer.data)


class ContactInquiryDetailView(JWTView):
    allowed_roles = ['SUPER_ADMIN']

    def get_object(self, pk):
        try:
            return ContactInquiry.objects.get(pk=pk)
        except ContactInquiry.DoesNotExist:
            return None

    def patch(self, request, pk):
        inquiry = self.get_object(pk)
        if not inquiry:
            return Response({'error': 'Inquiry not found.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            updated = ContactInquiryService.mark_status(inquiry, request.data.get('status'))
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        serializer = ContactInquirySerializer(updated)
        return Response({'message': 'Inquiry updated.', 'data': serializer.data})


class ContactInquiryStatsView(JWTView):
    allowed_roles = ['SUPER_ADMIN']

    def get(self, request):
        return Response(ContactInquiryService.stats())
