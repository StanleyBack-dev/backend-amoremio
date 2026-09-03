import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { RESPONSE_MESSAGES } from "@/common/responses/catalogs/response-messages.catalog";
import {
  buildDataResponse,
  buildPaginatedListResponse,
} from "@/common/responses/helpers/response.helper";
import type { AuthenticatedUser } from "@/modules/auth/domain/interfaces/auth-token-payload.interface";
import { CreatePurchaseDraftUseCase } from "@/modules/purchasing/application/use-cases/create-purchase-draft.use-case";
import { GetPurchaseByIdUseCase } from "@/modules/purchasing/application/use-cases/get-purchase-by-id.use-case";
import { ListPurchasesUseCase } from "@/modules/purchasing/application/use-cases/list-purchases.use-case";
import { UpdatePurchaseHeaderUseCase } from "@/modules/purchasing/application/use-cases/update-purchase-header.use-case";
import { AddPurchaseItemUseCase } from "@/modules/purchasing/application/use-cases/add-purchase-item.use-case";
import { UpdatePurchaseItemUseCase } from "@/modules/purchasing/application/use-cases/update-purchase-item.use-case";
import { RemovePurchaseItemUseCase } from "@/modules/purchasing/application/use-cases/remove-purchase-item.use-case";
import { FinalizePurchaseUseCase } from "@/modules/purchasing/application/use-cases/finalize-purchase.use-case";
import { CancelPurchaseUseCase } from "@/modules/purchasing/application/use-cases/cancel-purchase.use-case";
import { PurchaseResponseDto } from "@/modules/purchasing/presentation/graphql/dtos/purchase-response.dto";
import { PurchaseFilterOptionsDto } from "@/modules/purchasing/presentation/graphql/dtos/purchase-filter-options.dto";
import {
  ListPurchasesResponseDto,
  PurchaseMutationResponseDto,
} from "@/modules/purchasing/presentation/graphql/dtos/purchase-list-response.dto";
import {
  AddPurchaseItemInputDto,
  CreatePurchaseDraftInputDto,
  GetPurchaseFilterOptionsInputDto,
  ListPurchasesInputDto,
  PurchaseScopeInputDto,
  RemovePurchaseItemInputDto,
  UpdatePurchaseHeaderInputDto,
  UpdatePurchaseItemInputDto,
} from "@/modules/purchasing/presentation/graphql/dtos/purchase-input.dtos";
import "@/modules/purchasing/presentation/graphql/enums/purchasing-graphql.enums";

@Resolver()
export class PurchasesResolver {
  constructor(
    private readonly createPurchaseDraftUseCase: CreatePurchaseDraftUseCase,
    private readonly getPurchaseByIdUseCase: GetPurchaseByIdUseCase,
    private readonly listPurchasesUseCase: ListPurchasesUseCase,
    private readonly updatePurchaseHeaderUseCase: UpdatePurchaseHeaderUseCase,
    private readonly addPurchaseItemUseCase: AddPurchaseItemUseCase,
    private readonly updatePurchaseItemUseCase: UpdatePurchaseItemUseCase,
    private readonly removePurchaseItemUseCase: RemovePurchaseItemUseCase,
    private readonly finalizePurchaseUseCase: FinalizePurchaseUseCase,
    private readonly cancelPurchaseUseCase: CancelPurchaseUseCase,
  ) {}

  @Query(() => ListPurchasesResponseDto, { name: "getStorePurchases" })
  async getStorePurchases(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: ListPurchasesInputDto,
  ) {
    const result = await this.listPurchasesUseCase.execute(user.idUsers, input);
    return buildPaginatedListResponse(
      {
        ...result,
        items: result.items.map((item) => PurchaseResponseDto.fromView(item)),
      },
      RESPONSE_MESSAGES.purchasing.listed,
    );
  }

  @Query(() => PurchaseFilterOptionsDto, {
    name: "getStorePurchaseFilterOptions",
  })
  async getStorePurchaseFilterOptions(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: GetPurchaseFilterOptionsInputDto,
  ) {
    const options = await this.listPurchasesUseCase.filterOptions(
      user.idUsers,
      input.idStore,
    );
    return PurchaseFilterOptionsDto.fromView(options);
  }

  @Query(() => PurchaseResponseDto, { name: "getPurchaseById" })
  async getPurchaseById(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: PurchaseScopeInputDto,
  ) {
    const purchase = await this.getPurchaseByIdUseCase.execute(
      user.idUsers,
      input.idStore,
      input.idPurchase,
    );
    return PurchaseResponseDto.fromView(purchase);
  }

  @Mutation(() => PurchaseMutationResponseDto, { name: "createPurchaseDraft" })
  async createPurchaseDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: CreatePurchaseDraftInputDto,
  ) {
    const created = await this.createPurchaseDraftUseCase.execute(
      user.idUsers,
      input,
    );
    return buildDataResponse(
      PurchaseResponseDto.fromView(created),
      RESPONSE_MESSAGES.purchasing.created,
    );
  }

  @Mutation(() => PurchaseMutationResponseDto, { name: "updatePurchaseHeader" })
  async updatePurchaseHeader(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdatePurchaseHeaderInputDto,
  ) {
    const updated = await this.updatePurchaseHeaderUseCase.execute(
      user.idUsers,
      input,
    );
    return buildDataResponse(
      PurchaseResponseDto.fromView(updated),
      RESPONSE_MESSAGES.purchasing.updated,
    );
  }

  @Mutation(() => PurchaseMutationResponseDto, { name: "addPurchaseItem" })
  async addPurchaseItem(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: AddPurchaseItemInputDto,
  ) {
    const updated = await this.addPurchaseItemUseCase.execute(user.idUsers, {
      idStore: input.idStore,
      idPurchase: input.idPurchase,
      idProduct: input.idProduct,
      purchasedQuantity: input.purchasedQuantity,
      purchasedUnit: input.purchasedUnit ?? "",
      conversionFactor: input.conversionFactor,
      unitPrice: input.unitPrice,
    });
    return buildDataResponse(
      PurchaseResponseDto.fromView(updated),
      RESPONSE_MESSAGES.purchasing.updated,
    );
  }

  @Mutation(() => PurchaseMutationResponseDto, { name: "updatePurchaseItem" })
  async updatePurchaseItem(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: UpdatePurchaseItemInputDto,
  ) {
    const updated = await this.updatePurchaseItemUseCase.execute(
      user.idUsers,
      input,
    );
    return buildDataResponse(
      PurchaseResponseDto.fromView(updated),
      RESPONSE_MESSAGES.purchasing.updated,
    );
  }

  @Mutation(() => PurchaseMutationResponseDto, { name: "removePurchaseItem" })
  async removePurchaseItem(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: RemovePurchaseItemInputDto,
  ) {
    const updated = await this.removePurchaseItemUseCase.execute(
      user.idUsers,
      input.idStore,
      input.idPurchase,
      input.idPurchaseItem,
    );
    return buildDataResponse(
      PurchaseResponseDto.fromView(updated),
      RESPONSE_MESSAGES.purchasing.updated,
    );
  }

  @Mutation(() => PurchaseMutationResponseDto, { name: "finalizePurchase" })
  async finalizePurchase(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: PurchaseScopeInputDto,
  ) {
    const finalized = await this.finalizePurchaseUseCase.execute(
      user.idUsers,
      input.idStore,
      input.idPurchase,
    );
    return buildDataResponse(
      PurchaseResponseDto.fromView(finalized),
      RESPONSE_MESSAGES.purchasing.finalized,
    );
  }

  @Mutation(() => PurchaseMutationResponseDto, { name: "cancelPurchase" })
  async cancelPurchase(
    @CurrentUser() user: AuthenticatedUser,
    @Args("input") input: PurchaseScopeInputDto,
  ) {
    const cancelled = await this.cancelPurchaseUseCase.execute(
      user.idUsers,
      input.idStore,
      input.idPurchase,
    );
    return buildDataResponse(
      PurchaseResponseDto.fromView(cancelled),
      RESPONSE_MESSAGES.purchasing.cancelled,
    );
  }
}
