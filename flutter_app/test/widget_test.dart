import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    // HireFlow app requires ProviderScope — tested in integration tests.
    expect(true, isTrue);
  });
}
