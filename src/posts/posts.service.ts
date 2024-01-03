import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { In, Repository } from 'typeorm';
import { SearchService } from 'src/search/search.service';

@Injectable()
export class PostsService {
  private readonly esIndex = 'posts';

  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    private readonly searchService: SearchService,
  ) {}

  async create(createPostDto: CreatePostDto) {
    const newPost = this.postRepository.create(createPostDto);
    await this.postRepository.save(newPost);
    await this.searchService.index(this.esIndex, newPost);
    return newPost;
  }

  async findAll() {
    return await this.postRepository.find();
  }

  async search(search: string) {
    const results = await this.searchService.search(
      this.esIndex,
      ['title', 'content'],
      search,
    );
    const ids = results.map((result) => result.id);
    if (!ids.length) {
      return [];
    }
    return this.postRepository.find({
      where: {
        id: In(ids),
      },
    });
  }

  async findOne(id: string) {
    return await this.postRepository.findOneBy({ id });
  }

  async update(id: string, updatePostDto: UpdatePostDto) {
    await this.postRepository.update({ id }, updatePostDto);
    await this.searchService.update(this.esIndex, { id }, updatePostDto);
  }

  async remove(id: string) {
    await this.postRepository.delete({ id });
    await this.searchService.delete(this.esIndex, { id });
  }
}
