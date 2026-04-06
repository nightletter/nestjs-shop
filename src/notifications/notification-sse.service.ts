import { Subject, Observable } from 'rxjs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationSseService {
  private readonly subjects = new Map<number, Subject<MessageEvent>>();

  getOrCreateSubject(userId: number): Subject<MessageEvent> {
    if (!this.subjects.has(userId)) {
      this.subjects.set(userId, new Subject<MessageEvent>());
    }
    return this.subjects.get(userId)!;
  }

  asObservable(userId: number): Observable<MessageEvent> {
    return this.getOrCreateSubject(userId).asObservable();
  }

  push(event: string, userId: number, data: any): void {
    const subject = this.subjects.get(userId);
    if (subject && !subject.closed) {
      subject.next({ data: { type: event, ...data } } as MessageEvent);
    }
  }

  remove(userId: number): void {
    const subject = this.subjects.get(userId);
    if (subject) {
      subject.complete();
      this.subjects.delete(userId);
    }
  }
}
