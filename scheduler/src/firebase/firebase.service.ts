import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private db!: admin.firestore.Firestore;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    if (admin.apps.length) {
      this.db = admin.firestore();
      return;
    }

    const projectId = this.config.get<string>('FIREBASE_PROJECT_ID');
    const credentialsPath = this.config.get<string>('GOOGLE_APPLICATION_CREDENTIALS');

    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID is required');
    }

    let credential: admin.credential.Credential;

    if (credentialsPath) {
      const absolutePath = resolve(credentialsPath);
      if (!existsSync(absolutePath)) {
        throw new Error(`Service account file not found: ${absolutePath}`);
      }
      const serviceAccount = JSON.parse(readFileSync(absolutePath, 'utf8'));
      credential = admin.credential.cert(serviceAccount);
    } else {
      credential = admin.credential.applicationDefault();
    }

    admin.initializeApp({ credential, projectId });
    this.db = admin.firestore();
    this.logger.log(`Firebase Admin initialized for project: ${projectId}`);
  }

  get firestore(): admin.firestore.Firestore {
    return this.db;
  }

  get FieldValue() {
    return admin.firestore.FieldValue;
  }
}
