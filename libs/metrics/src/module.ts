import { PrometheusModule } from 'nestjs-prometheus';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
  ],
})
export class MetricsModule {}
