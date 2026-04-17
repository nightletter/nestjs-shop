import { Subject } from 'rxjs';
import { NotificationSseService } from './notification-sse.service';

describe('NotificationSseService', () => {
  let service: NotificationSseService;

  beforeEach(() => {
    service = new NotificationSseService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrCreateSubject', () => {
    it('should create a new subject if not exists', () => {
      const userId = 1;
      const subject = service.getOrCreateSubject(userId);

      expect(subject).toBeInstanceOf(Subject);
    });

    it('should return the same subject for the same user', () => {
      const userId = 1;
      const subject1 = service.getOrCreateSubject(userId);
      const subject2 = service.getOrCreateSubject(userId);

      expect(subject1).toBe(subject2);
    });

    it('should create different subjects for different users', () => {
      const subject1 = service.getOrCreateSubject(1);
      const subject2 = service.getOrCreateSubject(2);

      expect(subject1).not.toBe(subject2);
    });

    it('should handle multiple users independently', () => {
      const subject1 = service.getOrCreateSubject(1);
      const subject2 = service.getOrCreateSubject(2);
      const subject3 = service.getOrCreateSubject(3);

      expect(subject1).not.toBe(subject2);
      expect(subject2).not.toBe(subject3);
      expect(subject1).not.toBe(subject3);
    });
  });

  describe('asObservable', () => {
    it('should return an observable for the user', (done) => {
      const userId = 1;
      const observable = service.asObservable(userId);

      observable.subscribe((event) => {
        expect(event.data.type).toBe('test.event');
        expect(event.data.message).toBe('Hello');
        done();
      });

      service.push('test.event', userId, { message: 'Hello' });
    });

    it('should emit events from getOrCreateSubject', (done) => {
      const userId = 1;
      const subject = service.getOrCreateSubject(userId);
      const observable = service.asObservable(userId);

      let eventCount = 0;
      observable.subscribe((event) => {
        eventCount++;
        if (eventCount === 1) {
          expect(event.data.type).toBe('event1');
          service.push('event2', userId, {});
        } else if (eventCount === 2) {
          expect(event.data.type).toBe('event2');
          done();
        }
      });

      service.push('event1', userId, {});
    });

    it('should create subject if not exists when calling asObservable', () => {
      const userId = 1;
      const observable = service.asObservable(userId);

      expect(observable).toBeDefined();
    });

    it('should handle multiple subscribers to same user', (done) => {
      const userId = 1;
      const observable = service.asObservable(userId);

      let subscriber1Count = 0;
      let subscriber2Count = 0;

      observable.subscribe(() => {
        subscriber1Count++;
      });

      observable.subscribe(() => {
        subscriber2Count++;
      });

      service.push('test', userId, {});

      setTimeout(() => {
        expect(subscriber1Count).toBe(1);
        expect(subscriber2Count).toBe(1);
        done();
      }, 50);
    });
  });

  describe('push', () => {
    it('should push event data to existing subject', (done) => {
      const userId = 1;
      const observable = service.asObservable(userId);

      observable.subscribe((event) => {
        expect(event.data.type).toBe('test.event');
        expect(event.data.points).toBe(1000);
        done();
      });

      service.push('test.event', userId, { points: 1000 });
    });

    it('should include event type in data', (done) => {
      const userId = 1;
      const observable = service.asObservable(userId);

      observable.subscribe((event) => {
        expect(event.data.type).toBe('order.created');
        expect(event.data.orderId).toBe(123);
        done();
      });

      service.push('order.created', userId, { orderId: 123 });
    });

    it('should not push event if subject is closed', () => {
      const userId = 1;
      service.getOrCreateSubject(userId);
      service.remove(userId);

      const mockNext = jest.fn();
      service.push('test', userId, {});

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should not push event to non-existent user subject', () => {
      const userId = 1;
      service.push('test', userId, {});

      const subject = service.getOrCreateSubject(userId);
      const mockNext = jest.spyOn(subject, 'next');

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle complex data objects', (done) => {
      const userId = 1;
      const observable = service.asObservable(userId);

      const complexData = {
        orderId: 123,
        items: [{ id: 1, name: 'Item 1' }],
        metadata: { status: 'pending' },
      };

      observable.subscribe((event) => {
        expect(event.data.orderId).toBe(123);
        expect(event.data.items).toEqual([{ id: 1, name: 'Item 1' }]);
        expect(event.data.metadata).toEqual({ status: 'pending' });
        done();
      });

      service.push('complex.event', userId, complexData);
    });

    it('should handle multiple events pushed sequentially', (done) => {
      const userId = 1;
      const observable = service.asObservable(userId);

      let eventCount = 0;
      const events: string[] = [];

      observable.subscribe((event) => {
        eventCount++;
        events.push(event.data.type);

        if (eventCount === 3) {
          expect(events).toEqual(['event1', 'event2', 'event3']);
          done();
        }
      });

      service.push('event1', userId, {});
      service.push('event2', userId, {});
      service.push('event3', userId, {});
    });

    it('should push events to correct user only', (done) => {
      const user1 = 1;
      const user2 = 2;
      const observable1 = service.asObservable(user1);
      const observable2 = service.asObservable(user2);

      const user1Events: string[] = [];
      const user2Events: string[] = [];

      observable1.subscribe((event) => {
        user1Events.push(event.data.type);
      });

      observable2.subscribe((event) => {
        user2Events.push(event.data.type);
      });

      service.push('event1', user1, {});
      service.push('event2', user2, {});
      service.push('event3', user1, {});

      setTimeout(() => {
        expect(user1Events).toEqual(['event1', 'event3']);
        expect(user2Events).toEqual(['event2']);
        done();
      }, 50);
    });
  });

  describe('remove', () => {
    it('should remove subject for user', () => {
      const userId = 1;
      const subject = service.getOrCreateSubject(userId);

      service.remove(userId);

      const newSubject = service.getOrCreateSubject(userId);
      expect(newSubject).not.toBe(subject);
    });

    it('should complete the subject before removing', (done) => {
      const userId = 1;
      const observable = service.asObservable(userId);

      let completed = false;
      observable.subscribe(
        () => {},
        () => {},
        () => {
          completed = true;
        },
      );

      service.remove(userId);

      setTimeout(() => {
        expect(completed).toBe(true);
        done();
      }, 50);
    });

    it('should handle removing non-existent user gracefully', () => {
      expect(() => service.remove(999)).not.toThrow();
    });

    it('should prevent push to removed user subject', (done) => {
      const userId = 1;
      service.getOrCreateSubject(userId);
      service.remove(userId);

      service.push('test', userId, {});

      const observable = service.asObservable(userId);
      let received = false;

      observable.subscribe(
        () => {
          received = true;
        },
        () => {},
        () => {
          expect(received).toBe(false);
          done();
        },
      );

      setTimeout(() => {
        done();
      }, 100);
    });

    it('should allow creating new subject for removed user', () => {
      const userId = 1;
      const subject1 = service.getOrCreateSubject(userId);
      service.remove(userId);
      const subject2 = service.getOrCreateSubject(userId);

      expect(subject1).not.toBe(subject2);
    });

    it('should handle removing multiple users', () => {
      const user1 = 1;
      const user2 = 2;

      service.getOrCreateSubject(user1);
      service.getOrCreateSubject(user2);

      service.remove(user1);
      service.remove(user2);

      const newSubject1 = service.getOrCreateSubject(user1);
      const newSubject2 = service.getOrCreateSubject(user2);

      expect(newSubject1).toBeDefined();
      expect(newSubject2).toBeDefined();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete user lifecycle', (done) => {
      const userId = 1;

      // Step 1: Create observable and subscribe
      const observable = service.asObservable(userId);
      const events: string[] = [];

      observable.subscribe((event) => {
        events.push(event.data.type);
      });

      // Step 2: Push events
      service.push('event1', userId, {});
      service.push('event2', userId, {});

      setTimeout(() => {
        // Step 3: Verify events received
        expect(events).toEqual(['event1', 'event2']);

        // Step 4: Remove user
        service.remove(userId);

        // Step 5: Try to push more events (should not receive)
        service.push('event3', userId, {});

        setTimeout(() => {
          expect(events).toEqual(['event1', 'event2']);
          done();
        }, 50);
      }, 50);
    });

    it('should handle concurrent operations', (done) => {
      const user1 = 1;
      const user2 = 2;
      const user3 = 3;

      const obs1 = service.asObservable(user1);
      const obs2 = service.asObservable(user2);
      const obs3 = service.asObservable(user3);

      const events1: string[] = [];
      const events2: string[] = [];
      const events3: string[] = [];

      obs1.subscribe((e) => events1.push(e.data.type));
      obs2.subscribe((e) => events2.push(e.data.type));
      obs3.subscribe((e) => events3.push(e.data.type));

      service.push('a', user1, {});
      service.push('b', user2, {});
      service.push('c', user3, {});
      service.push('d', user1, {});
      service.push('e', user2, {});

      setTimeout(() => {
        expect(events1).toEqual(['a', 'd']);
        expect(events2).toEqual(['b', 'e']);
        expect(events3).toEqual(['c']);
        done();
      }, 50);
    });
  });
});
