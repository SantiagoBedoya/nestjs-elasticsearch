import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class SearchService {
  constructor(private readonly esService: ElasticsearchService) {}

  async index(idx: string, record: Record<string, any>) {
    return await this.esService.index({
      index: idx,
      body: record,
    });
  }

  async search(idx: string, fields: string[], text: string) {
    const result = await this.esService.search({
      index: idx,
      body: {
        query: {
          multi_match: {
            query: text,
            fields: fields,
          },
        },
      },
    });
    return result.body.hits.hits.map((hit) => hit._source);
  }

  async delete(idx: string, matchQuery: Record<string, any>) {
    await this.esService.deleteByQuery({
      index: idx,
      body: {
        query: {
          match: matchQuery,
        },
      },
    });
  }

  async update(
    idx: string,
    matchQuery: Record<string, any>,
    newObject: Record<string, any>,
  ) {
    const script = Object.entries(newObject).reduce((result, [key, value]) => {
      return `${result} ctx._source.${key}='${value}';`;
    }, '');

    return this.esService.updateByQuery({
      index: idx,
      body: {
        query: {
          match: matchQuery,
        },
        script: {
          inline: script,
        },
      },
    });
  }
}
