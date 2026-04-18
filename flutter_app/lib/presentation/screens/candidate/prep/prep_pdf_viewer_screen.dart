import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:syncfusion_flutter_pdfviewer/pdfviewer.dart';
import '../../../../core/theme/app_theme.dart';

class PrepPdfViewerScreen extends StatelessWidget {
  final Uint8List pdfBytes;

  const PrepPdfViewerScreen({super.key, required this.pdfBytes});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Prep Report'),
        backgroundColor: AppColors.surface,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: SfPdfViewer.memory(
        pdfBytes,
        canShowScrollHead: false,
        canShowScrollStatus: false,
      ),
    );
  }
}
