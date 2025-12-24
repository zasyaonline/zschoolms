import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ZSchool Management System API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for ZSchool Management System',
      contact: {
        name: 'ZSchool Support',
        email: 'support@zasyaonline.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:5001',
        description: 'Development server',
      },
      {
        url: 'https://api.zschool.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            firstName: {
              type: 'string',
              description: 'First name',
            },
            lastName: {
              type: 'string',
              description: 'Last name',
            },
            role: {
              type: 'string',
              enum: ['admin', 'teacher', 'student', 'parent', 'sponsor'],
              description: 'User role',
            },
            isActive: {
              type: 'boolean',
              description: 'Account active status',
            },
            mfaEnabled: {
              type: 'boolean',
              description: 'MFA enabled status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            lastLoginAt: {
              type: 'string',
              format: 'date-time',
              nullable: true,
              description: 'Last login timestamp',
            },
          },
        },
        Student: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Student ID',
            },
            userId: {
              type: 'string',
              format: 'uuid',
              description: 'Associated user account ID',
            },
            enrollmentNumber: {
              type: 'string',
              description: 'Unique enrollment number',
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              description: 'Date of birth',
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other'],
              description: 'Gender',
            },
            bloodGroup: {
              type: 'string',
              description: 'Blood group',
            },
            admissionDate: {
              type: 'string',
              format: 'date',
              description: 'Admission date',
            },
            currentClass: {
              type: 'string',
              description: 'Current class/grade',
            },
            section: {
              type: 'string',
              description: 'Class section',
            },
            rollNumber: {
              type: 'string',
              description: 'Roll number',
            },
            parentId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'Parent user ID',
            },
            sponsorId: {
              type: 'string',
              format: 'uuid',
              nullable: true,
              description: 'Sponsor user ID',
            },
            address: {
              type: 'string',
              description: 'Residential address',
            },
            city: {
              type: 'string',
              description: 'City',
            },
            state: {
              type: 'string',
              description: 'State',
            },
            pincode: {
              type: 'string',
              description: 'Postal code',
            },
            emergencyContact: {
              type: 'string',
              description: 'Emergency contact number',
            },
            medicalInfo: {
              type: 'string',
              nullable: true,
              description: 'Medical information',
            },
            isActive: {
              type: 'boolean',
              description: 'Active status',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Success message',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {},
                },
                pagination: {
                  type: 'object',
                  properties: {
                    total: {
                      type: 'integer',
                    },
                    page: {
                      type: 'integer',
                    },
                    limit: {
                      type: 'integer',
                    },
                    totalPages: {
                      type: 'integer',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication and authorization endpoints',
      },
      {
        name: 'Users',
        description: 'User management operations',
      },
      {
        name: 'Students',
        description: 'Student management operations',
      },
      {
        name: 'Health',
        description: 'System health and status checks',
      },
    ],
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
